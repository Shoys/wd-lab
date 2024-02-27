rm -rf build/
mkdir build/

for file in $(find src -type f -name "*.html" -or -name "*.js")
do
  newfile=${file#src/}
  cp "$file" "build/$newfile"
done

for file in $(find src -type f -name "*.scss")
do
  newfile=${file#src/}
  newfile=${newfile%.scss}.css
  sass "$file" "build/$newfile"
done
