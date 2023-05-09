# `app-lblod-harvester-worship`

Mu-semtech stack for harvesting and processing Worship Decisions from external
sources. For the regular harvesting of Decisions, see
[`app-lblod-harvester`](https://github.com/lblod/app-lblod-harvester).

## List of Services

| Service                                                                                                    | Repository                                                           |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| identifier                                                                                                 | https://github.com/mu-semtech/mu-identifier                          |
| dispatcher                                                                                                 | https://github.com/mu-semtech/mu-dispatcher                          |
| frontend                                                                                                   | https://github.com/lblod/frontend-harvesting-self-service            |
| database                                                                                                   | https://github.com/mu-semtech/mu-authorization                       |
| virtuoso                                                                                                   | https://github.com/redpencilio/docker-virtuoso                       |
| migrations                                                                                                 | https://github.com/mu-semtech/mu-migrations-service                  |
| cache                                                                                                      | https://github.com/mu-semtech/mu-cache                               |
| resource                                                                                                   | https://github.com/mu-semtech/mu-cl-resources                        |
| deltanotifier                                                                                              | https://github.com/mu-semtech/delta-notifier                         |
| file                                                                                                       | https://github.com/mu-semtech/file-service                           |
| login                                                                                                      | https://github.com/mu-semtech/login-service                          |
| harvest_singleton-job                                                                                      | https://github.com/lblod/harvesting-singleton-job-service            |
| harvest_download-url                                                                                       | https://github.com/lblod/download-url-service                        |
| harvest_check-url                                                                                          | https://github.com/lblod/harvest-check-url-collection-service        |
| harvest_collect                                                                                            | https://github.com/lblod/harvest-collector-service                   |
| harvest_import                                                                                             | https://github.com/lblod/harvesting-import-service                   |
| harvest_validate                                                                                           | https://github.com/lblod/harvesting-validator                        |
| harvest_diff                                                                                               | https://github.com/lblod/harvesting-diff-service                     |
| harvest_sameas                                                                                             | https://github.com/lblod/import-with-sameas-service                  |
| job-controller                                                                                             | https://github.com/lblod/job-controller-service                      |
| scheduled-job-controller                                                                                   | https://github.com/lblod/scheduled-job-controller-service            |
| deliver-email                                                                                              | https://github.com/redpencilio/deliver-email-service                 |
| error-alert                                                                                                | https://github.com/lblod/loket-error-alert-service                   |
| delta-producer-report-generator                                                                            | https://github.com/lblod/delta-producer-report-generator             |
| delta-producer-dump-file-publisher                                                                         | https://github.com/lblod/delta-producer-dump-file-publisher          |
| delta-producer-background-jobs-initiator-besluiten, delta-producer-background-jobs-initiator-worship       | https://github.com/lblod/delta-producer-background-jobs-initiator    |
| delta-producer-publication-graph-maintainer-besluiten, delta-producer-publication-graph-maintainer-worship | https://github.com/lblod/delta-producer-publication-graph-maintainer |

## Setup and startup

To start this stack, clone this repository and start it using `docker compose`
using the following example snippet.

```bash
git clone git@github.com:lblod/app-lblod-harvester.git
cd app-lblod-harvester
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

## Authentication

This app allows you to add authentication fields to both the Job and Scheduled
Job request. To protect the app from unauthorized access via the frontend and
API, you need to be authenticated. To configure authentication, you need to add
an environment variable to the `frontend-harvester-self-service` and update the
mu-authorization config. This should all be in place for this repository, no
work needed. Having authentication is the main difference between this
repository and the regular harvester.

### Frontend service

Make sure to have the `EMBER_AUTHENTICATION_ENABLED` environment variable to
the frontend service set to true.

```yaml
frontend:
  image: lblod/frontend-harvesting-self-service:2.1.0
  environment:
    EMBER_AUTHENICATION_ENABLED: 'true'
```

### mu-authorization

The following function should be added to the config:

``` elixir
defmodule Acl.UserGroups.Config do
  [...]
  defp logged_in_user() do
    %AccessByQuery{
      vars: [],
      query: "PREFIX session: <http://mu.semte.ch/vocabularies/session/>
              SELECT DISTINCT ?account WHERE {
                <SESSION_ID> session:account ?account.
              }"
    }
  end
  [...]
end
```

Set the access function of the harvesting group to the `logged_in_user()`
function:

```elixir
[...]
def user_groups do
  [
    # Harvesting
    %GroupSpec{
      name: "harvesting",
      useage: [:write, :read_for_write, :read],
      access: logged_in_user(),
      graphs: [ %GraphSpec{
        [...]
```

At last you will need to remove the `DEFAULT_MU_AUTH_ALLOWED_GROUPS_HEADER` and
`DEFAULT_ACCESS_CONTROL_ALLOW_ORIGIN_HEADER` variables from the identifier
service.

### Migration to create user

To have access to the frontend app you will need to create an account through
migrations.

```sparql
PREFIX foaf:     <http://xmlns.com/foaf/0.1/>
PREFIX users:    <http://mu.semte.ch/graphs/users>
PREFIX accounts: <http://mu.semte.ch/graphs/users>
PREFIX dcterms:  <http://purl.org/dc/terms/>
PREFIX mu:       <http://mu.semte.ch/vocabularies/core/>
PREFIX account:  <http://mu.semte.ch/vocabularies/account/>
PREFIX xsd:      <http://www.w3.org/2001/XMLSchema#>

INSERT DATA {
  GRAPH <http://mu.semte.ch/graphs/users> {
    users:4cb86562-a6c8-4ff3-8ea1-ad68d8c7b0d8
        a foaf:Person ;
        foaf:name "Test user" ;
        foaf:account accounts:de3dc3dc-fb2f-47df-b1ef-13de15ec1109 ;
        mu:uuid "4cb86562-a6c8-4ff3-8ea1-ad68d8c7b0d8" ;
        dcterms:created "2023-03-08T14:40:00Z"^^xsd:datetime ;
        dcterms:modified "2023-03-08T14:40:00Z"^^xsd:datetime .
    accounts:de3dc3dc-fb2f-47df-b1ef-13de15ec1109
        a foaf:OnlineAccount ;
        foaf:accountName "testuser" ;
        mu:uuid "de3dc3dc-fb2f-47df-b1ef-13de15ec1109" ;
        account:password "<generate a hashed password>" ;
        account:salt "<random salt>" ;
        account:status <http://mu.semte.ch/vocabularies/account/status/active> ;
        dcterms:created "2023-03-08T14:40:00Z"^^xsd:datetime ;
        dcterms:modified "2023-03-08T14:40:00Z"^^xsd:datetime .
  }
}
```

Restart migrations and then use this account to log in.

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
