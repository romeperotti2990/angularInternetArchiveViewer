BUGS: 
the pagination does not change it every time
you have to sress the show files button twice to make it work
the search is still going by metadata and not just showing individual files based on seperate metadata assigned to it
the search function only works if you are on the search page and then press enter on the bar, if you press enter on the bar in another page it just navigates to the search page without actually searching
the emulator needs a proxy to fix some CORS stuff
the open in emulator button only appears on .zip files but this is fine for now as it is not a perminate feature
the pagination seems to be half of what it should be and there is like ghost double content
changing the pagination while having a filter removes the filter

FEATURES NEEDED:
emulatorjs
document viewing
video viewing
audio listening
metadata provider
search filters
metadata service
loading placholders for pagination

IDEAS:
have the navbar show: "last items: ..." and show the items you viewed last
maybe with the top change we could have several files for using media, instead of one big one

COMMANDS:

ng serve
node server.js