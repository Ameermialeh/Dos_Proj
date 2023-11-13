run# docker-compose build // to build the 3 images
run# docker images // to show you 3 images 
docker network create --subnet=172.18.0.0/16 internal-network
run# docker run -it -d -v .\frontend-server\src:/app/src -p 8000:8000  --network internal-network --ip 172.18.0.6 --name frontend-container  testing-frontend-server 
run# docker run -it -d -v .\order-server\src:/app/src -p 8002:8002 --network internal-network --ip 172.18.0.8 --name order-container testing-order-server 
run# docker run -it -d -v .\catalog-server\src:/app/src -p 8001:8001 --network internal-network --ip 172.18.0.7  --name catalog-container testing-catalog-server  