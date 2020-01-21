# Video Annotation Tool

* [Video Annotation Tool](https://github.com/phev8/video-annotation-tool.git) (this repository)

## Quickstart

### 0. Prerequisites:

* [git](https://git-scm.com/downloads) 
* [Docker](https://docs.docker.com/install/)
* [Docker Compose](https://docs.docker.com/compose/install/)

Additionally if the installation is occurring in a windows system, ensure that git checks out files with unix style endings by running the following:

```bash
$ git config --global core.autocrlf false
```


### 1. Clone the repository

This repository serves as a parent module for our client and server implementation. 
```bash
$ git clone -b smart-labels https://github.com/phev8/video-annotation-tool.git
```

### 2. Edit .env

Change `SAT_HOSTNAME` entry in the `.env`.

```bash
$ cd video-annotation-tool
$ nano .env
```

```dotenv
SAT_HOSTNAME=localhost
```

In case of windows systems, you might have to set this to the ip of the running docker daemon.

### 3. Pull containers and bring them up (launch):

```bash
$ cd video-annotation-tool
$ (sudo) docker-compose up --build
```
This process will take some time and will install the required node modules and will build a running mongodb instance, a backend tier and a front-end tier.

When the process is finished, open your browser and go to `localhost:4200`.

If running on a windows instance, you might have to connect to the `<docker-host-ip>:4200`

## Initial Set-up

Kindy refer to the getting-started.doc for walkthroughs on getting started and creating a project for labelling.



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
