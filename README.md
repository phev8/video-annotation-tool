# Signal Annotation Tool

* [Signal Annotation Tool](https://github.com/phev8/signal-annotation-tool) (this repository)
* [Signal Annotation Tool (Client)](https://github.com/etherealyn/signal-annotation-tool-client) 
* [Signal Annotation Tool (Server)](https://github.com/etherealyn/signal-annotation-tool-server) 

## Quickstart

### Prerequisites:

* [git](https://git-scm.com/downloads) 
* [Docker](https://docs.docker.com/install/)
* [Docker Compose](https://docs.docker.com/compose/install/)


### 1. Clone the repository

This repository serves as a parent module for our client and server implementation. `git clone`, therefore, requires `--recurse-submodules` flag.  

```bash
$ git clone --recurse-submodules https://github.com/phev8/signal-annotation-tool
```

### 2. Edit .env

Change `SAT_HOSTNAME` entry in the `.env`.

```bash
$ cd signal-annotation-tool
$ nano .env
```

```dotenv
SAT_HOSTNAME=example.com
```

### 3. Pull containers and bring them up (launch):

```bash
$ cd signal-annotation-tool
$ (sudo) docker-compose pull
$ (sudo) docker-compose up
```
When the process is finished, open your browser and go to `localhost:4200`.

Alternatively you can build containers locally:

```bash
docker-compose up --build
```

## Troubleshooting

###  Stop and remove containers, networks and volumes

WARNING: This will clear any data you had in your mongodb instance. If you wish to save persistent data, try this link 
(TODO: add a link describing how to backup docker volumes)

If you had a previous version running in your system you might want to remove previous containers, networks and volumes. 

```bash
$ docker-compose down
```

---

NOTE: The containers will attempt to use port 27017 for Mongo, port 4200 for the Frontend and port 3000 for the Backend. Depending on your system you might want to change these values in `docker-compose.yaml`.
