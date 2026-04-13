This is an internet archive view/use tool coded in angular using standalone components called Internet Archive Viewer (IAV for short). 
It is styled using tailwind.
It should be designed to search internet archive, take only the files and display them all with their own metadata from a different provider, and then use the files it finds without the user having to download them. 
For example, if I find a .gba file, we should be able to play it with emulator js, If I find a .mp3 file, I should be able to listen to it in the browser, etc etc.
It should also be able to see what is inside of .zip folders and use those as well.
USERS DO NOT NEED AN ACCOUNT OR AN EMAIL. it should just work. accounts are a future feature to think about, BUT ARE NOT IPLEMENTED CURRENTLY.
Also, do not mess with anything in the 4.2.3 folder, its just a dependency. treat it the same as you would the node_moduels folder.

INTENDED UX:
The user should go onto the site
the user should search for something in the bar at the top, filtering by filetype/mediatype
it should show lots of items filtered from files on internet archive (i'm thinking of abandoning the filtering idea, as it is proving difficult and it is kind of fun to find files yourself)
user clicks on an item and it shows more data about the item as well as a download and play/view button
user clicks on play and whatever means of viewing the content is brought up, along with still a download button, the app should take note that the user went here in the users history(localstorage)
If the user likes the media, they should be able to star it and save it to their favorites(localstorage if they do not have an account.)

STRUCTURE:
The current structure has components, pages, and services within their folders in /src/app.
right now we are working on functionality and ux
the main issue rn is the search giving you unexpected results


INSTRUCTIONS:
Make your code as clean and small as possible. If a file gets too big (500+ lines) then you need to start thinking about splitting that file into multiple.
Make sure you do not cause errors in the code and that your code matches with all the other code that is already there.
Make sure your code is the same logically as other code in the workspace.

CURRENT STATE:
You can search by software, movies, texts, and audio, but only roms can be played in the website. 
you can see inside of .zip files but it takes a while for some reason. also sometimes the roms that are zips within the zips do not work.
video, audio and image files just open in a new tab which works for now.

