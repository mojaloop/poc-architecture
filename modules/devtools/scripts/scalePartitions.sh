export PARTITION_SCALE=12
docker exec -e DPARTITION_SCALE=$PARTITION_SCALE -it kafka sh -c '/opt/kafka_*/bin/kafka-topics.sh --alter --zookeeper localhost:2181 --topic MLIngressEvents --partitions $DPARTITION_SCALE'
docker exec -e DPARTITION_SCALE=$PARTITION_SCALE -it kafka sh -c '/opt/kafka_*/bin/kafka-topics.sh --alter --zookeeper localhost:2181 --topic ParticipantCommands --partitions $DPARTITION_SCALE'
docker exec -e DPARTITION_SCALE=$PARTITION_SCALE -it kafka sh -c '/opt/kafka_*/bin/kafka-topics.sh --alter --zookeeper localhost:2181 --topic ParticipantDomainEvents --partitions $DPARTITION_SCALE'
docker exec -e DPARTITION_SCALE=$PARTITION_SCALE -it kafka sh -c '/opt/kafka_*/bin/kafka-topics.sh --alter --zookeeper localhost:2181 --topic TransferCommands --partitions $DPARTITION_SCALE'
docker exec -e DPARTITION_SCALE=$PARTITION_SCALE -it kafka sh -c '/opt/kafka_*/bin/kafka-topics.sh --alter --zookeeper localhost:2181 --topic TransferDomainEvents --partitions $DPARTITION_SCALE'
