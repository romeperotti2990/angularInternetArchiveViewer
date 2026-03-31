BUGS: 
the search is still going by metadata and not just showing individual files based on seperate metadata assigned to it
the pagination sometimes seems to be half of what it should be and there is like ghost double content
the search does not detect wether or not a zip actually has a rom in it or not
when you are playing a game and holding the up and down arrow keys it will scroll the page. (anndoying)
you have to press a filter in the top right of the navbar on the emulation page before the emulator appears for some reason

FEATURES NEEDED:
emulatorjs (mostly done)
document viewing
video viewing
audio listening
metadata provider
search filters (they are minimal rn)
metadata service
loading placholders for pagination (might not need it)

IDEAS:
have the navbar show: "last items: ..." and show the items you viewed last
maybe with the top change we could have several files for using media, instead of one big one
somtimes large items will take up the whole page so I could add minification
sometimes there are a lot of files from a collection so I could make like an item page to look at the whole thing

COMMANDS:

ng serve
node server.js