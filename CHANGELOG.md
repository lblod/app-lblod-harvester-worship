# Changelog
## 0.16.4 (2024-03-06)
 - Bump `import-with-sameas-service`: fix broken harvests due to splitting files when streaming triples. This was only a (visible) problem when harvesters started from scatch (when there is no information about mirrors in the triplestore yet).
## 0.16.3 (2024-02-23)
 - Hotfix: SHACL profile was too restrictive and had some typographic and logical problems concerning production data for EredienstMandatarissen positions.
## 0.16.2 (2024-02-09)
 - Bump `scheduled-job-controller-service` to make scheduled jobs have the vendor provenance like the non-scheduled jobs.
 - Adds the necessary resources config to store the vendor on the scheduled job.
## 0.16.1 (2024-02-01)
 - Bump `delta-producer-publication-graph-maintainer`
## 0.16.0 (2024-01-12)
 - added provenance tag
 - bumped a lot of services
### deploy notes
Since virtuoso has been bumped; you will have to follow the upgrade path.
See: https://github.com/redpencilio/docker-virtuoso/blob/dec36bd4a5ed4191c42e0a9b5ca979d67bc22cfe/README.md#upgrading
Note: probably in our context; we'll be making a full flush; as we need to harvest everything from scratch.
## 0.15.2 (2023-07-25)
- remove default mu-allowed-headers
## 0.15.1 (2023-07-25)
- remove default mu-allowed-headers
## 0.11.0 (2023-03-10)
- bump frontend with new features
  - add login feature flag (turn login on/off)
  - model change, store job auth info in harvest-collection instead of remote data object
- add authentication configuration to harvest-collection model (resources)
- bump harvest collector to support authentication configuration model change
## 0.10.0 (2023-02-23)
### :rocket: Enhancement
 - added support for authentication in normal jobs (scheduled jobs is still WIP)
## 0.9.0 (2022-12-02)
### :rocket: Enhancement
- improve performance by using a diff step by @nbittich in https://github.com/lblod/app-lblod-harvester/pull/19
- Upgrade virtuoso's config to offset to more than 1 million by @claire-lovisa in https://github.com/lblod/app-lblod-harvester/pull/17
- Add agendas and decision lists to the export by @claire-lovisa in https://github.com/lblod/app-lblod-harvester/pull/14
- Add error-alert service to receive emails when things go wrong by @claire-lovisa in https://github.com/lblod/app-lblod-harvester/pull/15
- Skip mu-auth for dump and initial sync jobs by @claire-lovisa in https://github.com/lblod/app-lblod-harvester/pull/16
- Add jobs to harvest Cevi and Remmicom by @claire-lovisa in https://github.com/lblod/app-lblod-harvester/pull/18
## 0.8.0 (2022-10-06)
### :rocket: Enhancement
- Bump frontend which includes some new features:
  - Allow users to filter the results by status
  - Show the target URI in the overview table
## 0.7.1 (2022-06-28)
### :bug: Fixes
- Revert frontend bump - causes issues with previous data
## 0.7.0 (2022-06-28)
### :bug: Fixes
- Sprintf worarounds
- Graph updates
- URI updates
### :rocket: Enhancement
- Bump multiple dependencies to use latest version of mu-auth-sudo (retry mechanism on queries)
- Bump frontend
## 0.6.0 (2022-03-11)
- Added the possibility to partially update scheduled jobs
## 0.5.1 (2021-12-17)
#### :bug: Bug Fix
- CVE-2021-45046: see https://spring.io/blog/2021/12/10/log4j2-vulnerability-and-spring-boot

## 0.5.0 (2021-11-04)
### :rocket: Enhancement
- bump of various services related to deltas (fixing bugs mainly)
- Important changes related to performance
  - harvest-collector: added queue processing and use parts of comunica instead of marawa to speed up parsing.
  - harvesting-import: use parts of comunica instead of marawa to speed up parsing.

## 0.4.1 (2021-10-07)
### :rocket: Enhancement
 - Bump new version of import-sameas, which might tackle some hanging jobs if no triples were found.
## 0.4.0 (2021-09-29)
### :rocket: Enhancement
 - Scheduled jobs
 - Less strict validation for motivation
## 0.3.0 (2021-09-09)
### :bug: Fixes
 - Update producer for missing properties on besluit and artikel
### :rocket: Enhancement
 - Report on broken URl's after publishing
