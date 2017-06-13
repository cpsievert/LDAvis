all: site

clean:
	rm -r docs/*/vis
	rm docs/*/*.html
	rm docs/*/*.md

site:
	cd docs && Rscript render.R && cd ..
