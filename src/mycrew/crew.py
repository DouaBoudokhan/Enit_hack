"""
CrewAI crew definition — Pipeline A.
Hierarchical process with a manager agent + 3 worker agents.
"""

import json
import os
from pathlib import Path

import yaml
from crewai import Agent, Crew, Process, Task
from langchain_openai import AzureChatOpenAI

from azure_config import normalize_azure_endpoint

BASE_DIR = Path(__file__).resolve().parents[2]
CONFIG_DIR = BASE_DIR / "config"


def _get_llm() -> AzureChatOpenAI:
    """Create an AzureChatOpenAI instance from environment variables."""
    return AzureChatOpenAI(
        azure_deployment=os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"],
        azure_endpoint=normalize_azure_endpoint(os.environ["AZURE_OPENAI_ENDPOINT"]),
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        temperature=0.2,
    )


def _load_yaml(filename: str) -> dict:
    """Load a YAML config file."""
    filepath = CONFIG_DIR / filename
    with open(filepath, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def create_crew() -> Crew:
    """
    Build and return the Pipeline A crew with hierarchical process.
    """
    agents_cfg = _load_yaml("agents.yaml")
    tasks_cfg = _load_yaml("tasks.yaml")
    llm = _get_llm()

    # --- Build worker agents ---
    content_analysis_agent = Agent(
        role=agents_cfg["content_analysis_agent"]["role"],
        goal=agents_cfg["content_analysis_agent"]["goal"],
        backstory=agents_cfg["content_analysis_agent"]["backstory"],
        allow_delegation=False,
        verbose=True,
        llm=llm,
    )

    community_profiler_agent = Agent(
        role=agents_cfg["community_profiler_agent"]["role"],
        goal=agents_cfg["community_profiler_agent"]["goal"],
        backstory=agents_cfg["community_profiler_agent"]["backstory"],
        allow_delegation=False,
        verbose=True,
        llm=llm,
    )

    match_agent = Agent(
        role=agents_cfg["match_agent"]["role"],
        goal=agents_cfg["match_agent"]["goal"],
        backstory=agents_cfg["match_agent"]["backstory"],
        allow_delegation=False,
        verbose=True,
        llm=llm,
    )

    # --- Build manager agent ---
    manager_llm = _get_llm()
    manager_agent = Agent(
        role=agents_cfg["manager"]["role"],
        goal=agents_cfg["manager"]["goal"],
        backstory=agents_cfg["manager"]["backstory"],
        allow_delegation=True,
        verbose=True,
        llm=manager_llm,
    )

    # --- Build tasks ---
    analyze_content_task = Task(
        description=tasks_cfg["analyze_content_task"]["description"],
        expected_output=tasks_cfg["analyze_content_task"]["expected_output"],
        agent=content_analysis_agent,
    )

    build_profile_task = Task(
        description=tasks_cfg["build_profile_task"]["description"],
        expected_output=tasks_cfg["build_profile_task"]["expected_output"],
        agent=community_profiler_agent,
        context=[analyze_content_task],
    )

    match_product_task = Task(
        description=tasks_cfg["match_product_task"]["description"],
        expected_output=tasks_cfg["match_product_task"]["expected_output"],
        agent=match_agent,
        context=[build_profile_task],
    )

    # --- Assemble crew ---
    crew = Crew(
        agents=[content_analysis_agent, community_profiler_agent, match_agent],
        tasks=[analyze_content_task, build_profile_task, match_product_task],
        process=Process.hierarchical,
        manager_agent=manager_agent,
        verbose=True,
    )

    return crew
