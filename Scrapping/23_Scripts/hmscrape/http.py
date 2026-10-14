"""HTTP poli : respect de robots.txt (RFC 9309, jokers * et $), délai par hôte, reprises."""
import logging
import re
import time
from urllib.parse import urlsplit

import requests

log = logging.getLogger("hmscrape")


class RobotsRules:
    def __init__(self, text: str | None, agent_token: str):
        self.rules: list[tuple[bool, str]] = []  # (allow, pattern)
        if not text:
            return
        groups: list[tuple[list[str], list[tuple[bool, str]]]] = []
        agents: list[str] = []
        rules: list[tuple[bool, str]] = []
        in_rules = False
        for raw in text.splitlines():
            line = raw.split("#", 1)[0].strip()
            if ":" not in line:
                continue
            key, val = (s.strip() for s in line.split(":", 1))
            key = key.lower()
            if key == "user-agent":
                if in_rules:
                    groups.append((agents, rules))
                    agents, rules, in_rules = [], [], False
                agents.append(val.lower())
            elif key in ("allow", "disallow"):
                in_rules = True
                if val:
                    rules.append((key == "allow", val))
        if agents:
            groups.append((agents, rules))
        token = agent_token.lower()
        specific = [r for a, r in groups if any(x != "*" and x in token for x in a)]
        chosen = specific or [r for a, r in groups if "*" in a]
        for r in chosen:
            self.rules.extend(r)

    @staticmethod
    def _match(pattern: str, path: str) -> int:
        regex = re.escape(pattern).replace(r"\*", ".*")
        if regex.endswith(r"\$"):
            regex = regex[:-2] + "$"
        m = re.match(regex, path)
        return len(pattern) if m else -1

    def allowed(self, path: str) -> bool:
        best_len, best_allow = -1, True
        for allow, pat in self.rules:
            n = self._match(pat, path)
            if n > best_len or (n == best_len and allow):
                best_len, best_allow = n, allow
        return best_allow


class PoliteSession:
    def __init__(self, cfg: dict):
        self.ua = cfg["user_agent"]
        self.token = self.ua.split("/")[0]
        self.timeout = cfg.get("request_timeout", 25)
        self.delay = cfg.get("min_delay_per_host", 1.5)
        self.retries = cfg.get("max_retries", 3)
        self.s = requests.Session()
        self.s.headers.update({"User-Agent": self.ua, "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.6"})
        self._robots: dict[str, RobotsRules] = {}
        self._last: dict[str, float] = {}
        self._host_delay: dict[str, float] = {}
        self._throttled: dict[str, int] = {}   # hôte -> nombre de 429 reçus
        self.max_429 = cfg.get("max_429_per_host", 4)
        self.stats = {"requests": 0, "robots_blocked": 0, "errors": 0}

    def _wait(self, host: str):
        last = self._last.get(host)
        if last is not None:
            gap = time.monotonic() - last
            delay = self._host_delay.get(host, self.delay)
            if gap < delay:
                time.sleep(delay - gap)
        self._last[host] = time.monotonic()

    def set_host_delay(self, url: str, delay: float):
        self._host_delay[urlsplit(url).netloc] = delay

    def host_blocked(self, url: str) -> bool:
        return self._throttled.get(urlsplit(url).netloc, 0) >= self.max_429

    def robots_allowed(self, url: str) -> bool:
        parts = urlsplit(url)
        origin = f"{parts.scheme}://{parts.netloc}"
        if origin not in self._robots:
            text = None
            try:
                self._wait(parts.netloc)
                r = self.s.get(origin + "/robots.txt", timeout=self.timeout)
                if r.status_code == 200:
                    text = r.text
                elif r.status_code in (401, 403):
                    text = "User-agent: *\nDisallow: /"  # accès refusé => on s'abstient
            except requests.RequestException as e:
                log.warning("robots.txt illisible pour %s : %s", origin, e)
            self._robots[origin] = RobotsRules(text, self.token)
        path = parts.path or "/"
        if parts.query:
            path += "?" + parts.query
        ok = self._robots[origin].allowed(path)
        if not ok:
            self.stats["robots_blocked"] += 1
        return ok

    def get(self, url: str, **kw) -> requests.Response | None:
        if not self.robots_allowed(url):
            log.info("robots.txt interdit : %s", url)
            return None
        host = urlsplit(url).netloc
        if self.host_blocked(url):
            self.stats["skipped_throttled"] = self.stats.get("skipped_throttled", 0) + 1
            return None
        for attempt in range(1, self.retries + 1):
            self._wait(host)
            try:
                self.stats["requests"] += 1
                r = self.s.get(url, timeout=self.timeout, **kw)
            except requests.RequestException as e:
                log.warning("Erreur réseau (%d/%d) %s : %s", attempt, self.retries, url, e)
                time.sleep(2 * attempt)
                continue
            if r.status_code == 429:
                self._throttled[host] = self._throttled.get(host, 0) + 1
                self.stats["http_429"] = self.stats.get("http_429", 0) + 1
                if self.host_blocked(url):
                    log.warning("Hôte %s : %d réponses 429 — ignoré pour le reste de l'exécution", host, self._throttled[host])
                    return None
            if r.status_code == 429 or r.status_code >= 500:
                wait = r.headers.get("Retry-After")
                wait_s = int(wait) if wait and wait.isdigit() else 5 * attempt
                log.warning("HTTP %d (%d/%d) %s — pause %ss", r.status_code, attempt, self.retries, url, wait_s)
                time.sleep(min(wait_s, 120))
                continue
            if r.status_code != 200:
                log.info("HTTP %d : %s", r.status_code, url)
                self.stats["errors"] += 1
                return None
            return r
        self.stats["errors"] += 1
        return None
