from pathlib import Path

import yaml
from crewai import Agent, Crew, Task


BASE_DIR = Path(__file__).resolve().parents[2]
CONFIG_DIR = BASE_DIR / "config"


def load_config(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file) or {}


def build_agents(config: dict) -> dict:
    agents = {}
    for name, data in (config.get("agents") or {}).items():
        agents[name] = Agent(
            role=data.get("role", name),
            goal=data.get("goal", ""),
            backstory=data.get("backstory", ""),
            allow_delegation=bool(data.get("allow_delegation", False)),
            verbose=False,
        )
    return agents


def build_tasks(config: dict, agents: dict, topic: str) -> list:
    tasks = []
    for _, data in (config.get("tasks") or {}).items():
        description = data.get("description", "").replace("{topic}", topic)
        tasks.append(
            Task(
                description=description,
                expected_output=data.get("expected_output", ""),
                agent=agents[data.get("agent")],
            )
        )
    return tasks


def create_crew(topic: str) -> Crew:
    agents_cfg = load_config(CONFIG_DIR / "agents.yaml")
    tasks_cfg = load_config(CONFIG_DIR / "tasks.yaml")

    agents = build_agents(agents_cfg)
    tasks = build_tasks(tasks_cfg, agents, topic)

    return Crew(agents=list(agents.values()), tasks=tasks, verbose=True)
