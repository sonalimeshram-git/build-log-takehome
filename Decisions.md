# Assumptions
 Assuming that the requirements are final and have been under gone all the discussions between PM and Team. 
 Assuming I can genrate the front end code, css files and backend python code with the help of AI but taking AI as a Peer.

## Decisions

### DB 
I will keep the DB extensible so in case if need to add anything in future we can do so.
I Added triggerred_by and author as these fields should be required in Prod so that we can trace the info on the builds for auditing and security reasons.
Wanted to add a metadata field to keep the DB extensible in future without expanding the DB size currently. This can hold json data cntaining any meta data info about the build that's useful ex: desc, reason for build etc. but reverted it.

### API
The requirement said to add 6 fields but I have extended it to also take 2 optional fields triggerred_by and author, without it the form should still work.

### Tests
Added DB specific smoke tests in test_smoke.py, there are multiple test cases available to check constraints and data integrity but I added the base test cases.
Used AI in generating the tests by providing the correct use cases for each test per the requirements in assignment.md, test_builds and test_builds_lis contain all the tests relevant to the 3 new APIs.
More tests are possible but and should be written but I have covered high level test scenarios with happy path and known failure paths.

### Local Build
I used npm and py commands to test the Front end and API integration locally, didn't setup docker.
used .venv because it provides  virtual env that keeps the backend's Python and Django packages seperate from other python packages so this project can use specific version.

