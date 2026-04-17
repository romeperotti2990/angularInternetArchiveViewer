BUGS/ PROBLEMS: 
the search is still going by IA metadata and not just showing individual files based on seperate metadata assigned to it
sometimes the roms that are zips within the zips do not work.
You cannot search for books, only text. hopfully this will be fixed after they are listed individually.
there are some files and filetypes that you can open in emulatorjs that have a high probability of not being a game so you download something you do not need
items do not appear in order when searching, changing the page, amount per page will sometimes re shuffle the responses. It might also be the way internet archive sends data. its been inconsistant
pressing "show files" more than once makes it show up much faster (pressing it twice makes it appear as soon as it has loaded, not after a delay)
downloading things other than roms has it not show the progress until it is done, meaning the user has no feedback until the download is done
the history in the nav only shows 4 items and not as many as can fit in the bar (wether that be less or more)
after clearing your history the files in your favorites break and no longer open in the app


FEATURES NEEDED:
emulatorjs (its essentially done, just having saving in game stay between sessions would be the only thing I would want, but this has proven incredibly hard in the past)
metadata provider/service
search filters (they are minimal rn)
search by filetype (we will have to look inside of zips, so it will have to search until it gets the amount of results as the pagination, then stop. this will still fetch a lot from internet archive and take a while, as it will have to use libarchive to peek into every one and extract it)
loading screens for pagination or a spinner (might not need it, might just want to have it show what it has loaded as it loads it)
you should be able to open the internet archive link normally (as in on internet archive itself) as well to see the source
deleting items from history
deleting all history/cache
seeing the 'show files' button on the media page with the description, so you can look at other files in the collection other than the one that you are looking at
I might make like a history page so you can look at your full history


IDEAS:
maybe with the top change we could have several files for using media, instead of one big one
somtimes large items will take up the whole page so I could add minification/collapsing
sometimes there are a lot of files from a collection so I could make like an item page to look at the whole thing
favoriteing items so you can go back to them
a random button (filterable, of course)
I would like for you to be able to look at a collection and view all the content in that collection, like in internet archive
making queue of items (not roms, of course)
we can probably remove almost all of the css files we dont need them because of tailwind

ASSIGNMENT REQIREMENTS:
google auth
firebase user info storage
only three small bugs maximum
app must be published

COMMANDS:

ng serve
node server.js