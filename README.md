## Instructions on how to use:

Run:
```sh
yarn install
yarn run dev
```

Connect to: ws://localhost:8080

## Commands:

### Register event
```JSON
{
  "type": "register-event-reminder",
  "name": "Event name",
  "date": "2022-09-11T18:47:00.785Z"
}
```

### List event reminders
```JSON
{
  "type": "list-event-reminders"
}
```

### Get current time
```JSON
{
  "type": "now"
}
```