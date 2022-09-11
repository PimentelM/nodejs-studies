import {Config, initServer} from "./server";

let config : Config = {
    port: 8080
}
initServer(config).then(() => {
    console.log(`Server started on  ws://localhost:${config.port}`);
});