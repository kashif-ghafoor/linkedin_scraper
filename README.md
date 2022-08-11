# linkedin_scraper

## prerequisites

node version 14

## installation

Install my-project with npm

```bash
git clone https://github.com/railflow/linkedin_scraper_2.git
cd linkedin_scraper_2/
npm i
```

## usage

run scraper with this command.

```bash

save file and execute following command to see the result.

```

### arguments

Required arguments:

````

## output

currently output will be saved in two formats json and csv. name of output files will be
profile-2.
### changing output file name.
go to dist/index.js on line 76 and 77. you can change output file name here.

after that save file and execute following command to see results.

```javascript
node dist/index.js
````

```

#### Note : you must provide either input or saved_search argument.

in the absence of both we don't have profile links to visit.
if both saved_search and input is provided then input is at first priority.

Optional arguments:

| argument       |     Default      | Description                                                           |
| :------------- | :--------------: | :-------------------------------------------------------------------- |
| --saved_search | no default value | url of saved search from sales navigator                              |
| --input        | no default value | name of text file containing profile links. if you don't provide      |
|                |                  | input file scraper will scrape profile links                          |
|                |                  | from sales navigator                                                  |
| --output       |   profiles.csv   | name of file where you want to store output of scraper i.e output.csv |

extra note: you may some time encounter the error that certain selector is not found. Don't worry I have implemented
multiple cases if it doesn't find one selector it will get another one.

there may be cases that i didn't encouter yet. they will not throw an error. and the only indication that something wrong happen
will be in your data either jobTitle will be empty string or jobTitle value will be replaced with companyName. I have scrape over 200 profiles didn't find any problem yet.
if you find any issue please let me know.
```
