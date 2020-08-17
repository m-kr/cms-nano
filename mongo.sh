mongodump
docker-compose exec -T mongo mongodump --uri="mongodb://root:root@0.0.0.0:27017/local?authSource=admin"
docker cp $(docker-compose ps -q mongo):dump .  

mongorestore
docker cp dump $(docker-compose ps -q mongo):.
docker-compose exec -T mongo mongorestore --uri="mongodb://root:root@0.0.0.0:27017/local?authSource=admin" ./dump
