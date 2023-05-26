# `app-lblod-harvester-worship`

Mu-semtech stack for harvesting and processing Worship Decisions from external
sources. For the regular harvesting of Decisions, see
[`app-lblod-harvester`](https://github.com/lblod/app-lblod-harvester).

## List of Services

See `docker-compose.yml` file.

## Setup and startup

To start this stack, clone this repository and start it using `docker compose`
using the following example snippet.

```bash
git clone git@github.com:lblod/app-lblod-harvester.git
cd app-lblod-harvester-worship
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

It can take a while before everything is up and running. In case there is an
error the first time you launch, just stopping and relaunching `docker compose`
should resolve any issues:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml stop
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

After starting, you might still have to wait for all the services to boot up,
and migrations to finish running. You can check this by inspecting the Docker
logs and wait for things to settle down. Once the stack is up and running
without errors you can visit the frontend in a browser on
`http://localhost:80`.

### Setting up the delta-producers related services

To make sure the app can share data, producers need to be set up. There is an
intial sync, that is potentially very expensive, and must be started manually.

#### Producer for mandatarissen and ministers worship

(Note: similar for other producers)

0. [Optional step, only on re-sync] Ensure the following in your docker-compose.override.yml, and then `docker-compose up -d`
```yaml
delta-producer-background-jobs-initiator-worship:
  environment:
    START_INITIAL_SYNC: "false"
```
1. Make sure the app is up and running, the migrations have run
2. In `docker-compose.override.yml`, make sure the following configuration is
   provided:

```yaml
delta-producer-background-jobs-initiator-worship:
  environment:
    START_INITIAL_SYNC: "true"
delta-producer-publication-graph-maintainer-worship:
  environment:
    KEY: "Add a random key with sufficient entropy"
```

3. Use `docker-compose up -d delta-producer-background-jobs-initiator-worship`
4. You can follow the status of the job, through the dashboard

## Authentication

This app allows you to add authentication fields to both the Job and Scheduled
Job request. To protect the app from unauthorized access via the frontend and
API, you need to be authenticated. To configure authentication, you need to add
an environment variable to the `frontend-harvester-self-service` and update the
mu-authorization config. This should all be in place for this repository, no
work needed. Having authentication is the main difference between this
repository and the regular harvester.

### Create login user (all environments)

For now, we use specific logins for the dashboard users. Each environment has
its own password. To add a user, make sure to have installed
[mu-cli](https://github.com/mu-semtech/mu-cli) first. Then in
`docker-compose.override.yml` add:

```yaml
dashboard-login
  environment:
    MU_APPLICATION_SALT: 'a_random_string_with_sufficient_entropy'
```

You can then generate a migration for creating a new user by running `mu script
project-scripts generate-dashboard-login` and following the steps. Restart
`migrations`, wait for them to finish and you can use the account you created
to login.

Note: on DEV and QA, the passwords will be kept in on the server in
`docker-compose.override.yml`

## Additional notes

### Performance

The default Virtuoso settings might be too weak if you need to ingest the
production data. There is a better config for this that you can use in your
`docker-compose.override.yml`

```yaml
virtuoso:
  volumes:
    - ./data/db:/data
    - ./config/virtuoso/virtuoso-production.ini:/data/virtuoso.ini
    - ./config/virtuoso/:/opt/virtuoso-scripts
```

### `delta-producer-report-generator`

Not all required parameters are provided, since these are deploy specific, see
[the delta-producer-report-generator
repository](https://github.com/lblod/delta-producer-report-generator).

### `deliver-email-service`

Should have credentials provided, see [the deliver-email-service
repository](https://github.com/redpencilio/deliver-email-service).

