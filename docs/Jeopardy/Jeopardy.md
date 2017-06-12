Jeopardy Data
==============

[Click here](http://cpsievert.github.io/LDAvis/Jeopardy/vis) to see the result of the code below:


```r
library("LDAvis")
data(Jeopardy, package = "LDAvisData")
```

```
## Error in find.package(package, lib.loc, verbose = verbose): there is no package called 'LDAvisData'
```

```r
json <- with(Jeopardy, createJSON(phi, theta, doc.length, vocab, term.frequency))
```

```
## Error in with(Jeopardy, createJSON(phi, theta, doc.length, vocab, term.frequency)): object 'Jeopardy' not found
```

```r
serVis(json, out.dir = 'vis', open.browser = FALSE)
```

```
## Error in cat(json, file = file.path(out.dir, "lda.json")): object 'json' not found
```
