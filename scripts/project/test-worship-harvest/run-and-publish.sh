#!/bin/bash
export JOB_OPERATION="http://lblod.data.gift/id/jobs/concept/JobOperation/lblodHarvestWorshipAndPublish"
exec node /script/main.js "$@"