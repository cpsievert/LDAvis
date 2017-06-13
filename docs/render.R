knit_examples <- function() {
  old <- getwd()
  on.exit(setwd(old))
  dirs <- dir()
  # keep only directories
  dirs <- dirs[file_test("-d", dirs)]
  # navigate intp each example and knit individually
  for (i in dirs) {
    setwd(i)
    knitr::knit2html(input = paste0(i, ".Rmd"), envir = new.env())
    setwd(old)
  }
}

knit_examples()
