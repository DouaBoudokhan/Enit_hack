from dotenv import load_dotenv

from mycrew.crew import create_crew


def main() -> None:
    load_dotenv()

    topic = input("Enter a topic: ").strip()
    crew = create_crew(topic)
    result = crew.kickoff()

    print("\n--- Result ---\n")
    print(result)


if __name__ == "__main__":
    main()
