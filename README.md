# Signal Annotation Tool

* [Signal Annotation Tool](https://github.com/phev8/signal-annotation-tool) (this repository)
* [Signal Annotation Tool (Client)](https://github.com/etherealyn/signal-annotation-tool-client) 
* [Signal Annotation Tool (Server)](https://github.com/etherealyn/signal-annotation-tool-server) 

## Quickstart

### Prerequisites:

* [git](https://git-scm.com/downloads) 
* [Docker](https://docs.docker.com/install/)
* [Docker Compose](https://docs.docker.com/install/)


## 1. Clone the repository

This repository serves as a parent module for our client and server implementation. `git clone`, therefore, requires `--recurse-submodules` flag.  

```bash
$ git clone --recurse-submodules https://github.com/phev8/signal-annotation-tool
```

### 2. Create and start containers

```bash
$ cd signal-annotation-tool
$ docker-compose up
```
When the process is finished, open your browser and go to `localhost:4200`.

### 3. Stop and remove containers, networks and volumes
```bash
$ docker-compose down
```

NOTE: The containers will attempt to use port 27017 for Mongo, port 4200 for the Frontend and port 3000 for the Backend. Depending on your system you might want to change these values in `docker-compose.yaml`.
