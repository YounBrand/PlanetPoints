## Getting Started

### Prerequisites
Make sure you have **Node.js** and **npm** installed on your local machine.

### Environment Setup
1. Clone the repository:
    ```sh
    git clone https://github.com/YounBrand/PlanetPoints
    ```

2. Before running tests or starting the server, you need a `.env` file.

#### Windows
```sh
copy .env.template .env
```
#### macOS/Linux
```sh
cp .env.template .env
```

3. Then fill in the required environment variables.

### Installation
1. Install dependencies and start the server:
    ```sh
    bash startup.sh
    ```
2. Open your web browser and navigate to `http://localhost:5173`.

### Testing
Run automated tests locally:
```sh
npm test
```

To continuously run tests while coding:
```sh
npm test:watch
```