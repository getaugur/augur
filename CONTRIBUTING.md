# Contributing

## Prerequisite

- [Node.js](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) or [Podman](https://podman.io/)

## Setup Repo

### Prepping Containers

1. Start the containers with `docker compose up -d`
   - Gorse may start before cockroach, erroring out. In this event, run `docker compose up -d cockroach` then `docker compose up -d gorse`
1. Run `docker compose exec cockroach ./cockroach sql --execute="CREATE DATABASE IF NOT EXISTS gorse;" --execute="CREATE DATABASE IF NOT EXISTS augur;" --insecure` to create a db for gorse and augur
