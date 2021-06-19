# Contributing to "Who is...?" 

If you would like to contribute and expand the coverage of "Who is...?", here's how you should go about doing it.

First, download a country's directory as if you were installing it, the default, original version is Scotland.

You will need to gather the necessary information about the lawmakers of the area you wish to add to our coverage. The default attributes required are:
 - Headshot image of lawmaker
 - Name
 - Political party
 - Area lawmaker represents
 - The lawmaker's Facebook page
 - The lawmaker's Twitter page
 - The lawmaker's Wikipedia page
 - The lawmaker's info page on the relevant government site

As well as this, a JSON dictionary of the party colours can be included to provide a small coloured icon for each lawmaker. 
The images are located in ```[country]/imgs/thumbnails```
The lawmaker information is located in ```[country]/info/lawmakers.json```
The party colours information is located in ```[country]/info/parties.json```

A walk through of doing this for the MPs of the UK parliament can also be found in this directory. (get_mp_information.py).
If you believe it would be valuable to include more resources, feel free to do so, but make sure to adjust the popup window as required!

Some other things to note:
You will probably want to change the flavour text in the popup to reference the country you are extending functionality to include. You will also want to update the logo for the government website of the country too.

If you have successfully extended functionality to include a new area, please get in contact to discuss adding it to the repo:

Email: ```ksw2@st-andrews.ac.uk```