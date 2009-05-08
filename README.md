JSDocs is javascript documentation generator written in JavaScript (Under Development)
==================================================

JSDocs is the a port of well known jsdoc-toolkit. It was decoupled from rhino and was adopted for used with Narwhal, JavaScript standard library conforming to the [ServerJS standard](https://wiki.mozilla.org/ServerJS). Primary goal is to provide a simplest way for Server-side Javascript environments to generate documentations without any deploy costs or dependencies to other libraries or runtimes. JSDocs will be available as standard JavaScript packages jspkg. Which will make it easy to install/deploy package through [getjs](http://github.com/dangoor/getjs) or whatever will be a standard JavaScript package management system. JSDocs doesn't depends on rhino any more and target is to support as many platforms as possible. Project really hopes to get a nice collaboration in order to get a powerful cross platform documentation tool. 

Current state
---------------- 

Currently project is under development, it is not heavily tested, but seems to be working. Code ported from jsdocs-toolkit is really messy and is was not designed for a modular systems conforming [Securable Modules specification](https://wiki.mozilla.org/ServerJS/Modules/SecurableModules). Therefor a major refactoring still has to be done. Template system is likely to be changed as it's really tied to the source code now. Everyone is more then welcome to take a part.

Getting Started
---------------

The current implementation uses Narwhal. Narwhal is a JavaScript standard library (based on the ServerJS standard: https://wiki.mozilla.org/ServerJS) and is located at http://github.com/tlrobinson/narwhal/

To start working with JSDoc, checkout the Narhwal and JSDocs repositories and add narwhal/bin to your PATH environment variable (e.x. "export PATH=$PATH:narwhal/bin"). Currently you need to use relative path symlinks to integrate with Narwhal.

1. cd narwhal/packages/ 
   ln -s ../../jsdocs jsdocs 

2. cd ../bin
   ln -s ../../jsdocs/bin/jsocs jsdocs

After you should be able to run tool by typeing:

  jsdocs -t jsdocs/templates/jsdoc/ bespinserv/lib/

-t points to the folder with template to be used. in the root of the repository you can find templates folder with one jsdoc subfolder. Thats a example template (jsdoc-toolkit templates are not compatible)
second argument is the path to folder containing sources that will be documented. for more additional info run

  jsdocs --help

Contributors
------------

* Irakli Gozalishvili

