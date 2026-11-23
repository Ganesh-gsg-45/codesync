$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$PSScriptRoot\.mvn-bin\apache-maven-3.9.6\bin;$env:PATH"
& "$PSScriptRoot\.mvn-bin\apache-maven-3.9.6\bin\mvn.cmd" $args
