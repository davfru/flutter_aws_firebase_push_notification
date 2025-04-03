# Push notification sender

Consumer an sqs queue and send push notification

Queue payload example:

```json
{
    "id": "a3947802-4051-709c-ca16-0f6e0143e3c1",
    "payload": {
        "title": "Ciao",
        "content": "Mondo"
    }
}
```