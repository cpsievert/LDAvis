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
#' @param as.gist should the vis be uploaded as a gist? Will prompt for an 
#' interactive login if the GITHUB_PAT environment variable is not set. For more
#' details, see \url{https://github.com/ropensci/gistr#authentication}.
#' @param ... arguments passed onto \code{gistr::gist_create}
#' 
#' @return An invisible object.
#' @seealso \link{createJSON}
#' @export
#' @author Carson Sievert
#' @examples
#' 
#' \dontrun{
#' # Use of serVis is documented here:
#' help(createJSON, package = "LDAvis")
#' }

serVis <- function(json, out.dir = tempfile(), open.browser = interactive(), 
                   as.gist = FALSE, ...) {

  ## Copy html/js/css files to out.dir
  dir.create(out.dir)
  src.dir <- system.file("htmljs", package = "LDAvis")
  to.copy <- Sys.glob(file.path(src.dir, "*"))
  file.copy(to.copy, out.dir, overwrite = TRUE, recursive = TRUE)
  
  ## Write json to out.dir
  cat(json, file = file.path(out.dir, "lda.json"))
  
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
