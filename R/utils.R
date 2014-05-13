#' Collection of distance matrix computation functions.
#' 
#' The proxy library allows us to pass an arbitrary bivariate function for 
#' distance matrix computations. This function will return different bivariate functions based on the input.
#' 
#' @param method character string. Specifies which distance measure to use. 'JS' and 'KL' are currently supported.
#' @export
#' @return Returns a bivariate function
#' 
#' x <- matrix(rnorm(100, mean = 100), nrow = 5)
#' dist(x)
#' library(proxy)
#' dist(x, method = distance())
#' dist(x, method = distance(measure = "KL"))
#' 

distance <- function(measure = "JS") {
  switch(measure,
         JS = function(x, y) {
            m <- 0.5*(x + y)
            0.5*sum(x*log(x/m)) + 0.5*sum(y*log(y/m))
         },
         KL = function(x, y) {
           0.5*sum(x*log(x/y)) + 0.5*sum(y*log(y/x))
         }
  ) 
}