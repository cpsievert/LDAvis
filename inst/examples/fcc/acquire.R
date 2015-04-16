# setwd("~/Desktop/github/local/LDAvis/inst/examples/fcc")

library("rvest")
html("http://www.fcc.gov/files/ecfs/14-28/ecfs-files.htm") %>%
  html_nodes(":contains('Compressed Files')+ ul a") %>%
  html_attr("href") -> hrefs

# download the zips
if (!file.exists("raw")) {
  dir.create("raw")
  target <- file.path("raw", basename(hrefs))
  mapply(download.file, hrefs, target)
}

# unzip 
if (!file.exists("unzipped")) {
  dir.create("unzipped")
  zips <- Sys.glob("raw/*")
  target <- file.path("unzipped", sub("\\.zip$", "", basename(hrefs)))
  mapply(function(x, y) unzip(x, exdir = y), zips, target)
}


