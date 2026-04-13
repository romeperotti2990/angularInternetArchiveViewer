BUGS/ PROBLEMS: 
the search is still going by IA metadata and not just showing individual files based on seperate metadata assigned to it
the pagination sometimes seems to be half of what it should be and there is like ghost double content (idk if this happens anymore)
when you are playing a game and holding the up and down arrow keys it will scroll the page. (annoying)
peeking inside of .zip files takes a while for some reason. 
sometimes the roms that are zips within the zips do not work.
You cannot search for books, only text. hopfully this will be fixed after they are listed individually.
it is hard to tell if a .zip or .7z or .iso is actually a rom or not, so you often end up downloading something that does not work with emulatorjs
items do not appear in order when searching, changing the page, amount per page will re shuffle the responses.
pressing "show files" more than once makes it show up much faster (pressing it twice makes it appear as soon as it has loaded, not after a delay)
things in zips are called "local item" in the history on the nav
the history on the nav is horribly bad looking after a few items are added
downloading things other than roms has it not show the progress until it is done, meaning the user has no feedback until the download is done

FEATURES NEEDED:
emulatorjs (its essentially done, just having saving in game stay between sessions would be the only thing I would want, but this has proven incredibly hard in the past)
audio listening
metadata provider/service
search filters (they are minimal rn)
loading screens for pagination (might not need it, might just want to have it show what it has loaded instead)
you  should be able to open the internet archive link normally as well to see the source


IDEAS:
maybe with the top change we could have several files for using media, instead of one big one
somtimes large items will take up the whole page so I could add minification
sometimes there are a lot of files from a collection so I could make like an item page to look at the whole thing
favoriteing items so you can go back to them
a random button (filterable, of course)
I would like for you to be able to look at a collection and view all the content in that collection, like in internet archive
making queue of items

COMMANDS:

ng serve
node server.js