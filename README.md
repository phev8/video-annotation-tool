# Signal Annotation Tool

* [Signal Annotation Tool](https://github.com/phev8/signal-annotation-tool) (this repository)
* [Signal Annotation Tool (Client)](https://github.com/etherealyn/signal-annotation-tool-client) 
* [Signal Annotation Tool (Server)](https://github.com/etherealyn/signal-annotation-tool-server) 

## Cloning the repository

This repository serves as a parent module for our client and server implementation. `git clone`, therefore, requires `--recurse-submodules` flag.  

```bash
$ git clone --recurse-submodules https://github.com/phev8/signal-annotation-tool
```

## Quickstart

### Prerequisites:

* Clone this repository
* Docker
* Docker Compose

### Create and start containers

```bash
$ docker-compose up
```
When the process is finished, open your browser and go to `localhost:4200`.

### Stop and remove containers, networks and volumes:
```bash
$ docker-compose down
```

NOTE: The containers will attempt to use port 27017 for Mongo, port 4200 for the Frontend and port 3000 for the Backend. Depending on your system you might want to change these values in `docker-compose.yaml`.
