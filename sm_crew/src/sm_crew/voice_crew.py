"""
Voice Investigation Crew — Uses Serper + ScrapeWebsite to research influencers in real-time.
Triggered by the voice assistant when a user asks about a specific influencer.
"""
from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai_tools import SerperDevTool, ScrapeWebsiteTool
from typing import List
import os

from azure_config import normalize_azure_endpoint

# Force proper Azure endpoint format
from azure_config import normalize_azure_endpoint
os.environ["AZURE_API_BASE"] = normalize_azure_endpoint(os.environ.get("AZURE_API_BASE"))

custom_llm = LLM(
    model=os.environ.get("model", "azure/gpt-4o"),
    temperature=0.1
)

# Tools
serper_tool = SerperDevTool()
scrape_tool = ScrapeWebsiteTool()


@CrewBase
class VoiceInvestigationCrew():
    """Crew that researches an influencer using web search and scraping,
    producing a concise reputation report for voice delivery."""

    agents_config = 'config/voice_agents.yaml'
    tasks_config = 'config/voice_tasks.yaml'

    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def web_researcher(self) -> Agent:
        return Agent(
            config=self.agents_config['web_researcher'],  # type: ignore[index]
            llm=custom_llm,
            tools=[serper_tool, scrape_tool],
            verbose=True,
            max_iter=8,
        )

    @agent
    def reputation_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['reputation_analyst'],  # type: ignore[index]
            llm=custom_llm,
            verbose=True,
        )

    @task
    def research_influencer_task(self) -> Task:
        return Task(
            config=self.tasks_config['research_influencer_task'],  # type: ignore[index]
        )

    @task
    def synthesize_reputation_task(self) -> Task:
        return Task(
            config=self.tasks_config['synthesize_reputation_task'],  # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=[self.web_researcher(), self.reputation_analyst()],
            tasks=[self.research_influencer_task(), self.synthesize_reputation_task()],
            process=Process.sequential,
            verbose=True,
        )
