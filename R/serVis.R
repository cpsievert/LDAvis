#' View and/or share LDAvis in a browser
#' 
#' @description View and/or share LDAvis in a browser.
#' 
#' @details This function will place the necessary html/js/css files (located in 
#' \code{system.file("htmljs", package = "LDAvis")}) in a directory specified 
#' by \code{out.dir}, start a local file server in that directory (if necessary), 
#' and (optionally) open the default browser in this directory. 
#' If \code{as.gist=TRUE}, it will attempt to upload these files as a gist (in this
#' case, please make sure you have the gistr package installed as well as your 
#' 'github.username' and 'github.password' set in \link{options}.)
#' 
#' @param json character string output from \link{createJSON}.
#' @param out.dir directory to store html/js/json files.
#' @param open.browser Should R open a browser? If yes, this function will 
#' attempt to create a local file server via the servr package.
#' This is necessary since the javascript needs to access local files and most 
#' browsers will not allow this.
#' @param stand.alone should the output be contained in a single html file?
#' @param as.gist should the vis be uploaded as a gist? Will prompt for an 
#' interactive login if the GITHUB_PAT environment variable is not set. For more
#' details, see \url{https://github.com/ropensci/gistr#authentication}.
#' @param ... arguments passed onto \code{gistr::gist_create}
#' @param language Which language to use in visualization? So far: \code{english} or \code{polish}.
#' @param encoding Sets the encoding to be used when writing the JSON file.
#'
#' @return An invisible object.
#' @seealso \link{createJSON}
#' @export
#' @author Carson Sievert
#' @importFrom utils read.csv
#' @examples
#' 
#' \dontrun{
#' # Use of serVis is documented here:
#' help(createJSON, package = "LDAvis")
#' }

serVis <- function(json, out.dir = tempfile(), open.browser = interactive(), stand.alone = FALSE,
                   as.gist = FALSE, language = "english", encoding = getOption("encoding"), ...) {

  stopifnot(is.character(language), length(language) == 1, language %in% c('english', 'polish'))
  
  ## Copy html/js/css files to out.dir
  dir.create(out.dir)
  src.dir <- system.file("htmljs", package = "LDAvis")
  to.copy <- Sys.glob(file.path(src.dir, "*"))
  file.copy(to.copy, out.dir, overwrite = TRUE, recursive = TRUE)
  
  ## Substitute words to different language if required
  if (language != 'english') {
    ldavis.js <- readLines(file.path(out.dir, "ldavis.js")) # changes are made only in this file
    lang.dict <- read.csv(system.file("languages/dictionary.txt",
                                      package = "LDAvis")) # read the dictionary
    for (i in 1:nrow(lang.dict)){ # substitute sentences row by row
      ldavis.js <- gsub(x  = ldavis.js, pattern = lang.dict[i, 1], 
                        replacement = lang.dict[i, language], fixed = TRUE)
    }
    # lambda coordinate to display its value
    if (language == 'polish') {
      ldavis.js[674] <- gsub(ldavis.js[674], pattern = "80", replacement ="175", fixed = TRUE)
    }
    # save new language version
    write(ldavis.js, file = file.path(out.dir, "ldavis.js"))
  }
  
  ## Write json to out.dir
  con <- file(file.path(out.dir, "lda.json"), encoding = encoding)	  
  on.exit(close.connection(con))
  cat(json, file = con)

  ## Try to upload gist
  if (as.gist) {
    gistd <- requireNamespace('gistr')
    if (!gistd) {
      warning("Please run `devtools::install_github('rOpenSci/gistr')` 
              to upload files to https://gist.github.com")
    } else {
      gist <- gistr::gist_create(file.path(out.dir, list.files(out.dir)), ...)
      if (interactive()) gist
      url_name <- paste("http://bl.ocks.org", gist$id, sep = "/")
      if (open.browser) utils::browseURL(url_name)
    }
    return(invisible())
  }
  
  if (stand.alone) {
    # wrap a vector x with an opening and closing html tag
    wrap_html <- function(x, tag) {
      tag <- paste0("<", tag, ">")
      x <- c(tag, x)
      x <- append(x, sub("<", "</", tag))
      x
    }
    
    index_file <- file.path(out.dir, "index.html")
    index_html <- readLines(index_file)
    
    # insert d3 script inline into html
    d3_file <- list.files(out.dir, "^d3.+js$", full.names = TRUE)
    d3_js <- readLines(d3_file)
    d3_js <- wrap_html(d3_js, "script")
    d3_js_include_line <- which(grepl(sprintf("<script src=\"%s\"></script>", basename(d3_file)), index_html))
    index_html[d3_js_include_line] <- ""
    index_html <- append(index_html, d3_js, d3_js_include_line)
    
    # insert formatted lda.json into ldavis.js
    ldavis_file <- file.path(out.dir, "ldavis.js")
    ldavis_js <- readLines(ldavis_file)
    d3.json_call_start_line <- which(grepl("d3.json\\(json_file, function\\(error, data\\) \\{", ldavis_js))
    ldavis_js[d3.json_call_start_line] <- sprintf('    data = %s;', json)
    d3.json_call_end_line <- tail(which(grepl("\\}\\)", ldavis_js)), 1)
    ldavis_js[d3.json_call_end_line] <- ""
    
    # insert ldvis.js script (with inlined lda.json) inline into html
    ldavis_js <- wrap_html(ldavis_js, "script")
    ldavis_js_include_line <- which(grepl("<script src=\"ldavis.js\"></script>", index_html))
    index_html[ldavis_js_include_line] <- ""
    index_html <- append(index_html, ldavis_js, ldavis_js_include_line)
    
    # insert lda.css inline into html
    lda_file <- file.path(out.dir, "lda.css")
    lda_css <- readLines(lda_file, warn = FALSE)
    lda_css <- wrap_html(lda_css, "style")
    lda_css_include_line <- which(grepl("<link rel=\"stylesheet\" type=\"text/css\" href=\"lda.css\">", index_html))
    index_html[lda_css_include_line] <- ""
    index_html <- append(index_html, lda_css, lda_css_include_line)
    
    # clean up
    unlink(file.path(out.dir, "*"))
    
    # write out stand alone html
    writeLines(index_html, index_file)
  }

  servd <- requireNamespace('servr')
  if (open.browser) {
    if (!servd) {
      message("If the visualization doesn't render, install the servr package\n",
               "and re-run serVis: \n install.packages('servr') \n",
              "Alternatively, you could configure your default browser to allow\n", 
              "access to local files as some browsers block this by default") 
      utils::browseURL(sprintf("%s/index.html", out.dir))
    } else {
      servr::httd(dir = out.dir)
    }
  }
  return(invisible())
}
