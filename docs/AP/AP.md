Associated Press
=================

[Click here](http://cpsievert.github.io/LDAvis/AP/vis) to see the result of the code below:


```r
library("LDAvis")
data(AP, package = "LDAvisData")
```

```
## Error in find.package(package, lib.loc, verbose = verbose): there is no package called 'LDAvisData'
```

```r
json <- with(AP, createJSON(phi, theta, doc.length, vocab, term.frequency))
```

```
## Error in with(AP, createJSON(phi, theta, doc.length, vocab, term.frequency)): object 'AP' not found
```

```r
serVis(json, out.dir = 'vis', open.browser = FALSE)
```

```
## Error in cat(json, file = file.path(out.dir, "lda.json")): object 'json' not found
```
