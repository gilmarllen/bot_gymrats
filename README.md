# GymBot

GymBot is a project aimed at creating an AI based bot to reply posts in the [GymRats app](https://www.gymrats.app/) with fun. It is supposed to run recurrently through a CronJob, as it process the posts created in the last X minutes.

## Dataflow

1. Start the script for all challenges set in the environment variables
2. Get the latest workouts from the challenge using GymRats API
3. Parse the workout data into a prompt
    1. If present, upload videos to GoogleAIFileManager 
    2. If present, parse images into base64 format
4. Prompt AI asking for a reply
5. Send the AI reply through GymRats API

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/gilmarllen/bot_gymrats.git
    ```
2. Navigate to the project directory:
    ```bash
    cd bot_gymrats
    ```
3. Install the dependencies:
    ```bash
    npm install
    ```

## Usage

1. Create a .env file and set the environment variables as suggested in the [.env.example file](.env.example). The user associated to the AUTHORIZATION_TOKEN variable (the bot) should have acess to the challenge group in the GymRats app.

2. Start the bot:
    ```bash
    npm run serve
    ```

## Build

```bash
npm run build
```

## Contributing

We welcome contributions! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch:
    ```bash
    git checkout -b feature/your-feature-name
    ```
3. Make your changes and commit them:
    ```bash
    git commit -m "Add your message here"
    ```
4. Push to the branch:
    ```bash
    git push origin feature/your-feature-name
    ```
5. Create a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
