# Participants


# Helper Functions for producing messages

```bash
kafkacat -v -b localhost:9092 -t ParticipantCommands -P ./test/resources/participantCreateCmd.json
```

```bash
kafkacat -v -b localhost:9092 -t ParticipantCommands -P ./test/resources/reservePayerFundCmd.json
```

## Monitor simulator

### Install ngrep on MacOS
```bash
brew install ngrep
```

### Install ngrep on Ubuntu
```bash
sudo apt install ngrep
```

### Command to monitor incomming Simulator requests
```bash
sudo ngrep -d lo0 port 8444
```

### Command to monitor incomming Mojaloop API requests
```bash
sudo ngrep -d lo0 port 3000
```
