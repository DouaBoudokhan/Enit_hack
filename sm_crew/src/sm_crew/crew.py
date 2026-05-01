from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
import os

custom_llm = LLM(
    model=os.environ.get("model", "azure/gpt-5.4-nano"),
    temperature=0.0
)

@CrewBase
class PostAnalysisCrew():
    """Crew for analyzing a single post"""

    agents_config = 'config/post_agents.yaml'
    tasks_config = 'config/post_tasks.yaml'

    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def post_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['post_analyst'], # type: ignore[index]
            llm=custom_llm,
            verbose=True
        )

    @task
    def analyze_post_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_post_task'], # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=[self.post_analyst()],
            tasks=[self.analyze_post_task()],
            process=Process.sequential,
            verbose=True,
        )


@CrewBase
class InfluencerReportCrew():
    """Crew for aggregating post summaries into a final influencer report"""

    agents_config = 'config/report_agents.yaml'
    tasks_config = 'config/report_tasks.yaml'

    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def influencer_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['influencer_analyst'], # type: ignore[index]
            llm=custom_llm,
            verbose=True
        )

    @task
    def aggregate_report_task(self) -> Task:
        return Task(
            config=self.tasks_config['aggregate_report_task'], # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=[self.influencer_analyst()],
            tasks=[self.aggregate_report_task()],
            process=Process.sequential,
            cache=True,
            verbose=True,
        )

