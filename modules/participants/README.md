# Participants


# Helper Functions for producing messages

```bash
kafkacat -v -b localhost:9092 -t ParticipantCommands -P ./test/resources/participantCreateCmd.json
```

```bash
kafkacat -v -b localhost:9092 -t ParticipantCommands -P ./test/resources/reservePayerFundCmd.json
```


Example docker-compose.yml with read side mongo:
```
version: '3.1'
services:
    kafka:
        image: "johnnypark/kafka-zookeeper"
        container_name: "poc_kafka"
        ports:
            - "2181:2181"
            - "9092:9092"
        environment:
            ADVERTISED_HOST: "CHANGEME"
            NUM_PARTITIONS: "8"
    kafka-manager:
        image: "sheepkiller/kafka-manager"
        ports:
            - "9000:9000"
        environment:
            ZK_HOSTS: poc_kafka:2181
    redis:
        image: "redis:alpine"
        ports:
            - "6379:6379"
    mongodb:
        image: "mongo"
        container_name: "poc_mongo"
        ports:
            - "27017:27017"
        environment:
            MONGO_INITDB_ROOT_USERNAME: root
            MONGO_INITDB_ROOT_PASSWORD: example
    mongo-express:
        image: mongo-express
        restart: always
        ports:
            - "8081:8081"
        environment:
            ME_CONFIG_MONGODB_SERVER: poc_mongo
            ME_CONFIG_MONGODB_ADMINUSERNAME: root
            ME_CONFIG_MONGODB_ADMINPASSWORD: example

```
