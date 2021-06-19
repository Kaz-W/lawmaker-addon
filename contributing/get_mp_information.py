from bs4 import BeautifulSoup
import requests
import urllib.request
from googlesearch import search
import re

# This file is a worked example of how information about lawmakers can be extracted and converted to a format
# consistent with the open source lawmaker information addon "Who is...?"

# As an example, this file extracts the data about sitting members of parliament in the UK parliament.
# As a source for the data, we use a locally saved copy of the html table of mps in this wikipedia page: https://en.wikipedia.org/wiki/List_of_MPs_elected_in_the_2019_United_Kingdom_general_election
# titled MPs.html

# Base url for MP parliament pages.
parliament_url = "https://members.parliament.uk/member"

# Open file and parse using BeautifulSoup
with open("MPs.html") as fp:
    soup = BeautifulSoup(fp, 'html.parser')

# We will write our output to a json file
# the format of each line in the .json file will be their name followed by a list of details we would like to have:
# "[Lawmaker name]": ["[Area they represent]", "[Party they represent]", "[wikipedia page]", "[facebook page]", "[Twitter page]", "[official parliament page]", "[summary from wikipedia]"]

# The method used for parsing is an example approach, depending on the data source, the data will likely need to be parsed differently.

with open("../lawmakers.json", "a") as f:
    f.write("{")

    # enumerate through each row in the table ("tr" ~ table row)
    for i, msp in enumerate(soup.find_all("tr")):

        print("enumerating:", i)

        # get all the cells of the table
        cells = msp.find_all("td")

        # there is a single image of each MP in each row of the table, we fetch
        img = msp.find("img")
        img_url = "https:" + img["src"]

        # store all the details of the table row in a list. We wont need all the info in the table, but from here we can select what we need.
        details = []
        for cell in cells:
            # append text except for final character of each string (which is \n control character)
            details.append(cell.text[:-1])

        name = details[3].strip()
        area = details[0].strip()
        party = details[2].strip()
        # Next we will comb the web for the MP's social media information using the Python Google library
        wiki = ""
        fb = ""
        twt = ""
        parl = ""
        wiki_summary = ""

        # we search for the MP's name plus "MP" (e.g. "Diane Abbott MP")
        for j in (search(name.replace(" ", "+") + "+MP wiki", tld='com', lang='en', num=10, start=0, stop=None, pause=0.1)):
            if j.startswith("https://en.wikipedia.org") and wiki == "":
                # title of lawmaker's wikipedia page
                wiki_title = re.findall("(?<=https:\/\/en\.wikipedia\.org\/wiki\/)[^.]*", j)[0]
                # Use wikipedia's api to get article summary.
                wiki_summary_request = requests.get("https://en.wikipedia.org/api/rest_v1/page/summary/{fname}".format(fname=wiki_title))
                wiki_summary = wiki_summary_request.json()["extract"]
                wiki = j
                break

        for j in (search(name.replace(" ", "+") + "+MP facebook", tld='com', lang='en', num=10, start=0, stop=None, pause=0.1)):
            if j.startswith("https://www.facebook") and fb == "":
                fb = j
                break

        for j in (search(name.replace(" ", "+") + "+MP twitter", tld='com', lang='en', num=10, start=0, stop=None, pause=0.1)):
            if j.startswith("https://twitter") and twt == "":
                # regex to filter so that only a direct link to MPs twitter is fetched
                twt = re.findall(".+?(?=status)|[^?]*", j)[0]
                break
        for j in (search(name.replace(" ", "+") + "+MP contact", tld='com', lang='en', num=10, start=0, stop=None, pause=0.1)):
            if j.startswith(parliament_url) and parl == "":
                parl = j
                break

        #print(g_search.text)
        print(wiki, fb, twt, parl)

        # When saving to Json, we should begin each new MP's entry by terminating the line before with a ",", not required when writing first line tho.
        if i != 0:
            f.write(',\n')
        else:
            f.write('\n')

        # Write line to file.
        f.write('"{name}": ["{area}", "{party}", "{wiki}", "{facebook}", "{twitter}", "{parl}", "{summary}"]'.format(name= name,
                                                                                                                     area = area,
                                                                                                                     party = party,
                                                                                                                     wiki = wiki,
                                                                                                                     facebook = fb,
                                                                                                                     twitter = twt,
                                                                                                                     parl = parl,
                                                                                                                     summary=wiki_summary))
        # Save MP's image to file.
        urllib.request.urlretrieve(img_url, "imgs/{fname}.jpg".format(fname = name).encode("utf8"))
    f.write("}")
