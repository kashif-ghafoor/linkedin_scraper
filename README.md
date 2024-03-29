# linkedin_scraper_2

## prerequisites

node version 14

## installation

Install my-project with npm and build it

```bash
git clone https://github.com/railflow/linkedin_scraper_2.git
cd linkedin_scraper_2/
npm i
npm run build
```

## usage

run scraper with this command.

```bash

node dist/index.js --session_id=<session-id of sales navigator account> --sesssion_id_profiles=<session-id of likedin account use to scrape profiles> --search_keyword=<keyword to search for in profiles> --saved_search=<url of saved search of sales navigator account> --output=<name of output csv file>

```

### arguments

Required arguments:

```
 --session_id  	            value of li_at cookie.
                            steps required to get value
                            1. Login to LinkedIn using an account of your choice.
                            2. Open Chrome developer tools
                            3. Go to tab Application, then from left panel select Storage -> Cookies -> https://www.linkedin.com. In the main view locate row with name li_at and copy content from the column Value.
 --search_keyword           keyword you want to search for in profiles. i.e testrail

 --sesssion_id_profiles     session id of linkedin account (most probably fake. it may get banned. )

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
