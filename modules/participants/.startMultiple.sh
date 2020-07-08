
# docker exec -it kafka sh -c "/opt/kafka_*/bin/kafka-topics.sh --alter --zookeeper localhost:2181 --topic ParticipantCommands --partitions 8"
docker exec -it kafka sh -c "/opt/kafka_*/bin/kafka-topics.sh --alter --zookeeper localhost:2181 --topic ParticipantCommands --partitions 16"

PARTICIPANTS_API_PORT=3011 npm start &
PARTICIPANTS_API_PORT=3012 npm start &
PARTICIPANTS_API_PORT=3013 npm start &
PARTICIPANTS_API_PORT=3014 npm start &
PARTICIPANTS_API_PORT=3015 npm start &
PARTICIPANTS_API_PORT=3016 npm start &
PARTICIPANTS_API_PORT=3017 npm start &
PARTICIPANTS_API_PORT=3018 npm start &
# PARTICIPANTS_API_PORT=3019 npm start &
# PARTICIPANTS_API_PORT=3020 npm start &
# PARTICIPANTS_API_PORT=3021 npm start &
# PARTICIPANTS_API_PORT=3022 npm start &


# MLIngressEvents
# docker exec -it kafka sh -c "/opt/kafka_*/bin/kafka-topics.sh --alter --zookeeper localhost:2181 --topic TransferDomainEvents --partitions 2"
# docker exec -it kafka sh -c "/opt/kafka_*/bin/kafka-topics.sh --alter --zookeeper localhost:2181 --topic MLIngressEvents --partitions 2"