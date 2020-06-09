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
sudo ngrep -d any "simulator" port 8444
```
