knit_examples <- function() {
  old <- getwd()
  on.exit(setwd(old))
  if (basename(old) != 'examples') stop("basename(getwd()) != 'examples'")
  dirs <- dir()
  # keep only directories
  dirs <- dirs[file_test("-d", dirs)]
  # navigate intp each example and knit individually
  for (i in dirs) {
    setwd(i)
    e <- try(knitr::knit2html(input = paste0(i, ".Rmd"), envir = new.env()))
    setwd(old)
  }
}

knit_examples()