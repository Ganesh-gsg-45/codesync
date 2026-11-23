@echo off
setlocal
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot"
set "PATH=%JAVA_HOME%\bin;%~dp0.mvn-bin\apache-maven-3.9.6\bin;%PATH%"
"%~dp0.mvn-bin\apache-maven-3.9.6\bin\mvn.cmd" %*
endlocal
