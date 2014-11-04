#!/usr/bin/env ruby

html   = File.readlines("dictionary.html")
css    = File.readlines("dictionary.css")
js     = File.readlines("dictionary.js")
output = File.open("single_file.html", "w")

html.each do |html_line|
  if html_line =~ /^(\s+).*dictionary\.css/
    space = $1
    output.write(space +'<style type="text/css">'+ "\n")
    css.each do |css_line|
      output.write(space +"  "+ css_line)
    end
    output.write(space +'</style>'+ "\n")
  elsif html_line =~ /^(\s+).*dictionary\.js/
    space = $1
    output.write(space +'<script type="text/javascript">'+ "\n")
    js.each do |js_line|
      output.write(space +"  "+ js_line)
    end
    output.write(space +'</script>'+ "\n")
  else
    output.write(html_line)
  end
end

output.close

