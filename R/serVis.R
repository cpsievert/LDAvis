#' Serve a pure javascript LDA visualization
#' 
#' This function will place the necessary html/js/css files (located in system.file("html", package = "LDAvis"))
#' in a directory specified by the argument out.dir. Then, if appropriate, the function will prompt your
#' browser to serve the visualization.
#' 
#' @param json character string output from the \link{createjson} function.
#' @param out.dir directory to store html/js/json files.
#' @param open.browser Should R open a browser? If yes, this function will attempt to create a local file server via the servr package.
#' This is necessary since the javascript needs to access local files and most browsers will not allow this.
#' @param as.gist should the vis be uploaded as a gist? If so, make sure your 'github.username' and 'github.password'
#' are set in \link{options}.
#' @param ... arguments passed onto gistr::gist_create if as.gist is TRUE
#'
#' @return An invisible object.
#' 
#' @seealso \link{createJSON}
#' @export
#' @author Carson Sievert
#' 
#' @examples
#' 
#' \dontrun{
#' help(createJSON, package = "LDAvis")
#' }



serVis <- function(json, out.dir = tempfile(), open.browser = interactive(), as.gist = FALSE, ...) {
  ## Copy html/js/css files to out.dir.
  dir.create(out.dir)
  src.dir <- system.file("html", package = "LDAvis")
  to.copy <- Sys.glob(file.path(src.dir, "*"))
  file.copy(to.copy, out.dir, overwrite = TRUE, recursive = TRUE)
  
  ## Write json to out.dir.
  cat(json, file = file.path(out.dir, "lda.json"))
  
  ## Try to upload gist
  if (as.gist) {
    gistd <- suppressMessages(suppressWarnings(require('gistr')))
    if (!gistd) {
      warning("Please run `devtools::install_github('rOpenSci/gistr')` to upload vis to https://gist.github.com")
    } else {
      gist <- gistr::gist_create(file.path(out.dir, list.files(out.dir)), ...)
      elem <- strsplit(gist, split = "/")[[1]]
      gist.code <- elem[length(elem)]
      url_name <- paste("http://bl.ocks.org", getOption("github.username"), gist.code, sep = "/")
      if (open.browser) browseURL(url_name)
    }
    return(invisible())
  }

  servd <- suppressMessages(suppressWarnings(require('servr')))
  if (open.browser) {
    if (!servd) {
      message("If the visualization doesn't render, consider installing the servr package -- \n install.packages('servr') \n",
              "Alternatively, you could configure your default browser to allow access to local files, \n", 
              "as some browsers block this by default") 
      browseURL(sprintf("%s/index.html", out.dir))
    } else {
      httd(dir = out.dir)
    }
  }
}